"use client";

import { useState } from "react";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";

export default function CommentModeration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  // Dummy data for comments
  const comments = [
    {
      post: "The Impact of Technology on the Workplace: How Technology is Changing",
      rating: 5,
      date: "21 Oct, 2024",
      contributors: [
        "/media/avatars/300-1.png",
        "/media/avatars/300-2.png",
        "/media/avatars/300-3.png",
      ],
    },
    {
      post: "The Impact of Technology on the Workplace: How Technology is Changing",
      rating: 5,
      date: "21 Oct, 2024",
      contributors: [
        "/media/avatars/300-2.png",
        "/media/avatars/300-4.png",
        "/media/avatars/300-1.png",
      ],
    },
  ];

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Comment Moderation
            </h1>
            <p className="text-gray-600">Approve/Reject/Spam comments efficiently</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>View Profile</span>
          </button>
        </div>

        {/* New Comments Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          {/* Header with Search */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Comments</h2>
            <input
              type="text"
              placeholder="Search Teams"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-700 text-sm border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 border-r border-gray-200 w-1/4">Post</th>
                  <th className="px-6 py-3 border-r border-gray-200">Rating</th>
                  <th className="px-6 py-3 border-r border-gray-200">Last Modified</th>
                  <th className="px-6 py-3">Contributors</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-200 w-1/4">
                      <div className="max-w-xs">
                        <p className="text-sm line-clamp-2 font-bold">{c.post}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      {"⭐".repeat(c.rating)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 border-r border-gray-200">{c.date}</td>
                    <td className="px-6 py-4 flex -space-x-2">
                      {c.contributors.map((src, idx) => (
                        <Image
                          key={idx}
                          src={src}
                          alt="contributor"
                          width={32}
                          height={32}
                          className="rounded-full border-2 border-white"
                        />
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <div className="flex items-center space-x-2">
              <span>Show</span>
              <select className="border rounded px-2 py-1 text-sm">
                <option>5</option>
                <option>10</option>
              </select>
              <span>per page</span>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1 rounded ${
                    page === 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex justify-center mb-6">
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-center space-x-8">
              {/* Status Filter */}
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <label className="text-sm font-semibold text-gray-800">Status</label>
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl px-4 py-3 pr-10 min-w-[140px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Spam">🚫 Spam</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              {/* Reason Filter */}
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <label className="text-sm font-semibold text-gray-800">Reason</label>
                </div>
                <div className="relative">
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl px-4 py-3 pr-10 min-w-[140px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Reasons</option>
                    <option value="Offensive">⚠️ Offensive</option>
                    <option value="Irrelevant">🔍 Irrelevant</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter || reasonFilter) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                    </svg>
                    <span>Active Filters:</span>
                  </span>
                  {statusFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("")}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {reasonFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Reason: {reasonFilter}
                      <button
                        onClick={() => setReasonFilter("")}
                        className="ml-2 text-orange-600 hover:text-orange-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments List */}
        <div className="flex justify-center">
          <div className="bg-white shadow rounded-lg w-1/2">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-center">Comments</h2>
            </div>
            <div className="divide-y">
              {[1, 2].map((c) => (
                <div key={c} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex-1 border-r border-gray-200 pr-6">
                    <p className="font-medium text-gray-900">Comment</p>
                    <p className="text-sm text-gray-500">User, Time and date</p>
                  </div>
                  <div className="flex space-x-2 pl-6">
                    <div className="flex flex-col items-center space-y-2">
                      <button className="group/btn px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Approve</span>
                      </button>
                      <div className="w-full h-px bg-gray-200"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <button className="group/btn px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Reject</span>
                      </button>
                      <div className="w-full h-px bg-gray-200"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <button className="group/btn px-4 py-2 text-sm font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        <span>Spam</span>
                      </button>
                      <div className="w-full h-px bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
